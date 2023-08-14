export const WEBSITE_CALCULATOR_REQUEST_SCHEMA = {
  $id: 'WebsiteCalculatorRequest',
  title: 'WebsiteCalculatorRequest',
  type: 'object',
  properties: {
    zip: {
      type: 'string',
      description:
        'Your zip code helps determine the amount of discounts and tax credits you qualify for.',
      maxLength: 5,
      minLength: 5,
      examples: [
        '80212',
      ],
    },
    owner_status: {
      type: 'string',
      description: 'Homeowners and renters qualify for different incentives.',
      enum: [
        'homeowner',
        'renter',
      ],
    },
    household_income: {
      type: 'integer',
      description:
        'Enter your gross income (income before taxes). Include wages and salary plus other forms of income, including pensions, interest, dividends, and rental income. If you are married and file jointly, include your spouse’s income.',
      minimum: 0,
      maximum: 100000000,
      examples: [
        80000,
      ],
    },
    tax_filing: {
      type: 'string',
      description:
        'Select "Head of Household" if you have a child or relative living with you, and you pay more than half the costs of your home. Select "Joint" if you file your taxes as a married couple.',
      enum: [
        'single',
        'joint',
        'hoh',
      ],
    },
    household_size: {
      type: 'integer',
      description:
        'Include anyone you live with who you claim as a dependent on your taxes, and your spouse or partner if you file taxes together.',
      minimum: 1,
      maximum: 8,
      examples: [
        2,
      ],
    },
  },
  required: [
    'zip',
    'owner_status',
    'household_income',
    'tax_filing',
    'household_size',
  ],
} as const;
