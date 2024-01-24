# Incentive Relationships Documentation

We currently support three types of relationships between incentives:

- **Prerequisites**: In order to be eligible for a given incentive, a user must claim at least one specific prerequisite incentive.
- **Exclusions**: If a user claims the given incentive, they may not be eligible to claim another one.
- **Combined Maximums**: A group of incentives may have a combined maximum amount that a user can claim.

The relationships for a state's incentives are specified in an _incentive_relationships.json_ file in that state's data directory. An example of the JSON structure is as follows:

```
{
  "prerequisites": {
    "incentive_A": "incentive_B",
    "incentive_B": { "anyOf": ["incentive_D", "incentive_E"] },
    "incentive_C": { "allOf": ["incentive_D", "incentive_E"] }
  },
  "exclusions": {
    "incentive_X": ["incentive_Y"]
  },
  "combinations": [
    { "ids": ["incentive_A", "incentive_B"], "max_value": 8000 }]
}
```

In the above prerequisites,

- The user can only be eligible for incentive_A if they are eligible to claim incentive_B.
- The user must be eligible to claim **either** incentive_D or incentive_E in order to be eligible for incentive_B.
- The user must be eligible to claim **both** incentive_D and incentive_E in order to be eligible for incentive_C.

The nested structure of `anyOf` and `allOf` can be arbitrarily complex if necessary, but we don't expect to need more than two levels to accurately express incentive requirements.

In the above exclusions, if the user is eligible for incentive_X, they cannot be eligible for incentive_Y. When specifying these, you must choose one to be the primary incentive that supersedes the set of incentives listed with it (currently the relationship definition is one-directional).

In the above combinations, the user is only eligible to claim $8000 for incentive_A and incentive_B combined, regardless of the individual values or maximums of those incentives.

There is a check in `schemas.test.ts` that looks for cycles in the relationships data and will fail if one is detected. This is to prevent an infinite loop being introduced in the calculation logic.
