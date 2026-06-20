"""Tests for the effective access resolution service (ADR-0001 §5.4, passe 4)."""

import pytest

from core import factories, models
from core.services import access_policy, relations

pytestmark = pytest.mark.django_db

R = models.RoleChoices


def _part_of(composite, part):
    relations.add_relation(composite, part, models.RelationTypeChoices.PART_OF)


def test_least_privileged_returns_lowest_role():
    assert access_policy.least_privileged([R.OWNER, R.EDITOR, R.READER]) == R.READER
    assert access_policy.least_privileged([R.OWNER, R.ADMIN]) == R.ADMIN


def test_least_privileged_is_none_if_any_missing_or_empty():
    assert access_policy.least_privileged([R.OWNER, None]) is None
    assert access_policy.least_privileged([]) is None


def test_effective_access_is_most_restrictive_across_parts():
    user = factories.UserFactory()
    composite = factories.ItemFactory(
        type=models.ItemTypeChoices.FOLDER, users=[(user, R.OWNER)]
    )
    part_a = factories.ItemFactory(users=[(user, R.EDITOR)])
    part_b = factories.ItemFactory(users=[(user, R.READER)])
    _part_of(composite, part_a)
    _part_of(composite, part_b)

    result = access_policy.resolve_effective_access(composite, user)

    assert result["own_role"] == R.OWNER
    assert result["effective_role"] == R.READER  # weakest link
    assert result["fully_accessible"] is True
    assert result["inaccessible_part_ids"] == []
    assert len(result["parts"]) == 2


def test_inaccessible_part_blocks_full_access():
    user = factories.UserFactory()
    composite = factories.ItemFactory(
        type=models.ItemTypeChoices.FOLDER, users=[(user, R.OWNER)]
    )
    readable = factories.ItemFactory(users=[(user, R.READER)])
    foreign = factories.ItemFactory()  # user has no access
    _part_of(composite, readable)
    _part_of(composite, foreign)

    result = access_policy.resolve_effective_access(composite, user)

    assert result["effective_role"] is None
    assert result["fully_accessible"] is False
    assert result["inaccessible_part_ids"] == [str(foreign.id)]


def test_no_parts_reflects_own_role():
    user = factories.UserFactory()
    composite = factories.ItemFactory(
        type=models.ItemTypeChoices.FOLDER, users=[(user, R.EDITOR)]
    )

    result = access_policy.resolve_effective_access(composite, user)

    assert result["own_role"] == R.EDITOR
    assert result["effective_role"] == R.EDITOR
    assert result["fully_accessible"] is True
    assert result["parts"] == []


def test_no_access_to_composite_is_not_accessible():
    owner = factories.UserFactory()
    stranger = factories.UserFactory()
    composite = factories.ItemFactory(
        type=models.ItemTypeChoices.FOLDER, users=[(owner, R.OWNER)]
    )
    _part_of(composite, factories.ItemFactory(users=[(owner, R.OWNER)]))

    result = access_policy.resolve_effective_access(composite, stranger)

    assert result["own_role"] is None
    assert result["effective_role"] is None
    assert result["fully_accessible"] is False
