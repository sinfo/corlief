module.exports = {
  LINK: {
    companyId: 'accenture',
    edition: 'someEdition',
    created: new Date(),
    token: 'someToken',
    valid: true,
    participationDays: 3,
    activities: [],
    advertisementKind: 'someAdv'
  },
  UPDATE: {
    participationDays: 3
  },
  LINK2: {
    companyId: 'link',
    edition: 'someEdition',
    created: new Date(),
    token: 'someToken',
    valid: true,
    participationDays: 3,
    activities: [],
    advertisementKind: 'someAdv'
  },
  LINK3: {
    companyId: 'deloitte',
    edition: 'someEdition',
    created: new Date(),
    token: 'someToken',
    valid: true,
    participationDays: 2,
    activities: [],
    advertisementKind: 'someAdv'
  },
  LINK11: {
    companyId: 'oneCompany',
    edition: 'oneEdition',
    created: new Date(),
    token: 'oneToken',
    valid: true,
    participationDays: 1,
    activities: [],
    advertisementKind: 'oneAdv'
  },
  LINK12: {
    companyId: 'oneCompany',
    edition: 'twoEdition',
    created: new Date(),
    token: 'twoToken',
    valid: true,
    participationDays: 2,
    activities: [],
    advertisementKind: 'twoAdv'
  },
  LINK21: {
    companyId: 'twoCompany',
    edition: 'oneEdition',
    created: new Date(),
    token: 'threeToken',
    valid: true,
    participationDays: 2,
    activities: [],
    advertisementKind: 'twoAdv'
  },
  INVALID_LINK: {
    companyId: 'noesis',
    edition: 'someEdition',
    created: new Date(),
    token: 'someToken',
    valid: false,
    participationDays: 3,
    activities: [],
    advertisementKind: 'someAdv'
  },
  VENUE1: {
    edition: 'someEdition',
    image: 'someImageUrl'
  },
  VENUE2: {
    edition: 'someOtherEdition',
    image: 'someOtherImageUrl'
  },
  STAND1: {
    topLeft: {
      x: 1,
      y: 3
    },
    bottomRight: {
      x: 2,
      y: 2
    }
  },
  STAND2: {
    topLeft: {
      x: 2,
      y: 4
    },
    bottomRight: {
      x: 3,
      y: 3
    }
  },
  STAND3: {
    topLeft: {
      x: 3,
      y: 5
    },
    bottomRight: {
      x: 4,
      y: 4
    }
  },
  STAND4: {
    topLeft: {
      x: 4,
      y: 6
    },
    bottomRight: {
      x: 5,
      y: 5
    }
  },
  RESERVATION1: {
    id: 1,
    companyId: 'oneCompany',
    edition: 'oneEdition',
    issued: new Date(),
    stands: [],
    feedback: {
      status: 'PENDING',
      member: ''
    }
  },
  RESERVATION2: {
    id: 2,
    companyId: 'oneCompany',
    edition: 'twoEdition',
    issued: new Date(),
    stands: [],
    feedback: {
      status: 'PENDING',
      member: ''
    }
  },
  RESERVATION3: {
    id: 3,
    companyId: 'twoCompany',
    edition: 'oneEdition',
    issued: new Date(),
    stands: [],
    feedback: {
      status: 'PENDING',
      member: ''
    }
  }
}
