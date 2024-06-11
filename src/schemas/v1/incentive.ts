import { FromSchema } from 'json-schema-to-ts';
import { AuthorityType } from '../../data/authorities';
import { AmiQualification } from '../../data/ira_incentives';
import { FilingStatus } from '../../data/tax_brackets';
import { AmountType, AmountUnit } from '../../data/types/amount';
import { PaymentMethod } from '../../data/types/incentive-types';
import { ALL_ITEMS } from '../../data/types/items';
import { OwnerStatus } from '../../data/types/owner-status';

export const API_INCENTIVE_SCHEMA = {
  $id: 'APIIncentive',
  type: 'object',
  required: [
    'payment_methods',
    'authority_type',
    'program',
    'program_url',
    'items',
    'amount',
    'owner_status',
  ],
  properties: {
    payment_methods: {
      type: 'array',
      description: `How a consumer receives value from this incentive.

- \`rebate\`: a post-purchase rebate.
- \`pos_rebate\`: a "point-of-sale" rebate; an upfront discount.
- \`tax_credit\`: a credit against federal or state taxes paid.
- \`account_credit\`: a credit on the consumer's utility account.
- \`assistance_program\`: no-cost products or services.
- \`performance_rebate\`: a post-purchase rebate that depends on measured or \
modeled efficiency improvements.
- \`unknown\`: something else.`,
      items: {
        type: 'string',
        enum: Object.values(PaymentMethod),
      },
      minItems: 1,
    },
    authority_type: {
      type: 'string',
      description: 'The nature of the entity offering the incentive.',
      enum: Object.values(AuthorityType),
    },
    authority: {
      type: 'string',
      description: `The government agency, company, or organization that \
offers this incentive. This generally means the entity that the consumer will \
interact with to _claim the incentive_, as opposed to the entity that sets the \
program rules, or that provides funding.`,
    },
    program: {
      type: 'string',
      description: `Consumer-facing name of the program that this incentive is \
part of. If the program has no distinct brand name, this string will usually \
include the name of the offering authority as well.`,
    },
    program_url: {
      type: 'string',
      description: `A URL to the best available official source of information \
on this program.`,
    },
    more_info_url: {
      type: 'string',
      description: `A URL to supplemental information on the program, usually \
from a third party rather than the offering authority. Localized according to \
the \`language\` request parameter.`,
    },
    items: {
      type: 'array',
      description: `What products or services the incentive can be used on. \
**NOTE**: we expect to add possible values to this field over time. Client \
code should gracefully handle unknown values it sees here.`,
      items: {
        type: 'string',
        enum: ALL_ITEMS,
      },
    },
    amount: {
      type: 'object',
      description: `The amount of monetary value that a consumer can receive \
from this incentive.

This format does not capture the full range of possible incentive structures, \
which can be very complex and dependent on a wide range of factors. It is a \
simplification in many cases. There are three amount structures, distinguished \
by the \`type\` field:

- \`dollar_amount\`: a flat amount. This value is also used as a catchall for \
amount structures that don't fit into the other categories; in such cases, the \
aim is to at least capture the maximum value the incentive can have.
- \`dollars_per_unit\`: an amount that scales with the size or capacity of the \
equipment.
- \`percent\`: an amount that is a percentage of the cost of the product or \
service.`,
      properties: {
        type: {
          type: 'string',
          description: 'The structure of the amount.',
          enum: Object.values(AmountType),
        },
        number: {
          type: 'number',
          description: `The dollar amount for \`dollar_amount\` and \
\`dollars_per_unit\` types, and a number between 0 and 1 inclusive for \
\`percent\` type (where 1 means 100%).`,
        },
        maximum: {
          type: 'number',
          description: 'The maximum dollar amount the incentive can have.',
        },
        representative: {
          type: 'number',
          description:
            "For non-flat amounts, an estimate of the incentive's typical value.",
        },
        unit: {
          type: 'string',
          description:
            'For `dollars_per_unit` type, the unit the amount depends on.',
          enum: Object.values(AmountUnit),
        },
      },
      additionalProperties: false,
      required: [
        'type',
        'number',
      ],
    },
    owner_status: {
      type: 'array',
      description: `Whether the consumer must be a homeowner or renter (or \
either) to claim this incentive.`,
      items: {
        type: 'string',
        enum: Object.values(OwnerStatus),
      },
      minItems: 1,
    },
    start_date: {
      type: 'string',
      description: `The time period when the incentive began, or will begin, \
to be available. Format is similar to an ISO-8601 date, but with some \
modifications and additions. Examples:

- \`2025\`: incentive begins some time during that year.
- \`2025-03\`: incentive begins some time during that month.
- \`2025-03-10\`: incentive begins that day.
- \`2025H2\`: incentive begins some time during that half-year.
- \`2025Q3\`: incentive begins some time during that quarter.`,
    },
    end_date: {
      type: 'string',
      description: `The date when the incentive stopped, or will stop, being \
available. Format is the same as for \`start_date\`.`,
    },
    ami_qualification: {
      type: 'string',
      nullable: true,
      enum: [...Object.values(AmiQualification), null],
      deprecated: true,
    },
    agi_max_limit: {
      type: 'number',
      nullable: true,
      deprecated: true,
    },
    agi_min_limit: {
      type: 'number',
      nullable: true,
      deprecated: true,
    },
    filing_status: {
      type: 'string',
      nullable: true,
      enum: [...Object.values(FilingStatus), null],
      deprecated: true,
    },
    short_description: {
      type: 'string',
      description: `A short display description for the incentive, localized \
according to the \`language\` request parameter. English descriptions are \
150 characters or less in almost all cases. May be slightly longer in other \
languages. Attempts to capture important data not expressed in other fields, \
such as required equipment specs, restrictions on existing home situation, etc.`,
    },
  },
  additionalProperties: false,
} as const;

export type APIIncentive = FromSchema<typeof API_INCENTIVE_SCHEMA>;
