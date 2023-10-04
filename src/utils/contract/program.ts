export type EarnReloaded = {
  version: '0.1.0';
  name: 'earn_reloaded';
  instructions: [
    {
      name: 'payout';
      docs: ['Payout Function'];
      accounts: [
        {
          name: 'authority';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'tokenMint';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'tokenAtaSender';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'tokenAtaReceiver';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'payoutAccount';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'tokenProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'associatedTokenProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'rent';
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: 'id';
          type: 'string';
        },
        {
          name: 'receiver';
          type: 'publicKey';
        },
        {
          name: 'amount';
          type: 'u64';
        }
      ];
    },
    {
      name: 'payoutSol';
      docs: ['Payout Sol Function'];
      accounts: [
        {
          name: 'authority';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'payoutAccount';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'receiverAccount';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'tokenProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'rent';
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: 'id';
          type: 'string';
        },
        {
          name: 'receiver';
          type: 'publicKey';
        },
        {
          name: 'amount';
          type: 'u64';
        }
      ];
    }
  ];
  accounts: [
    {
      name: 'payoutDetails';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'token';
            type: 'publicKey';
          },
          {
            name: 'receiver';
            type: 'publicKey';
          },
          {
            name: 'amount';
            type: 'u64';
          },
          {
            name: 'id';
            type: 'u64';
          },
          {
            name: 'bump';
            type: 'u8';
          }
        ];
      };
    },
    {
      name: 'payoutSolDetails';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'receiver';
            type: 'publicKey';
          },
          {
            name: 'amount';
            type: 'u64';
          },
          {
            name: 'id';
            type: 'u64';
          },
          {
            name: 'bump';
            type: 'u8';
          }
        ];
      };
    }
  ];
  errors: [
    {
      code: 6000;
      name: 'Mismatch';
      msg: 'Mismatch Error';
    }
  ];
};

export const IDL: EarnReloaded = {
  version: '0.1.0',
  name: 'earn_reloaded',
  instructions: [
    {
      name: 'payout',
      docs: ['Payout Function'],
      accounts: [
        {
          name: 'authority',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'tokenMint',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'tokenAtaSender',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'tokenAtaReceiver',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'payoutAccount',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'tokenProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'associatedTokenProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'rent',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'id',
          type: 'string',
        },
        {
          name: 'receiver',
          type: 'publicKey',
        },
        {
          name: 'amount',
          type: 'u64',
        },
      ],
    },
    {
      name: 'payoutSol',
      docs: ['Payout Sol Function'],
      accounts: [
        {
          name: 'authority',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'payoutAccount',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'receiverAccount',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'tokenProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'rent',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'id',
          type: 'string',
        },
        {
          name: 'receiver',
          type: 'publicKey',
        },
        {
          name: 'amount',
          type: 'u64',
        },
      ],
    },
  ],
  accounts: [
    {
      name: 'payoutDetails',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'token',
            type: 'publicKey',
          },
          {
            name: 'receiver',
            type: 'publicKey',
          },
          {
            name: 'amount',
            type: 'u64',
          },
          {
            name: 'id',
            type: 'u64',
          },
          {
            name: 'bump',
            type: 'u8',
          },
        ],
      },
    },
    {
      name: 'payoutSolDetails',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'receiver',
            type: 'publicKey',
          },
          {
            name: 'amount',
            type: 'u64',
          },
          {
            name: 'id',
            type: 'u64',
          },
          {
            name: 'bump',
            type: 'u8',
          },
        ],
      },
    },
  ],
  errors: [
    {
      code: 6000,
      name: 'Mismatch',
      msg: 'Mismatch Error',
    },
  ],
};
