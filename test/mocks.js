module.exports = {
  LINK: {
    companyId: 'accenture',
    contacts: {
      member: 'ze@sinfo.org',
      company: 'ze@accenture.pt'
    },
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
    contacts: {
      member: 'ze@sinfo.org',
      company: 'ze@accenture.pt'
    },
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
    contacts: {
      member: 'ze@sinfo.org',
      company: 'ze@accenture.pt'
    },
    edition: 'someEdition',
    created: new Date(),
    token: 'someToken',
    valid: true,
    participationDays: 2,
    activities: ['workshop'],
    advertisementKind: 'someAdv'
  },
  LINK11: {
    companyId: 'oneCompany',
    contacts: {
      member: 'ze@sinfo.org',
      company: 'ze@accenture.pt'
    },
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
    contacts: {
      member: 'ze@sinfo.org',
      company: 'ze@accenture.pt'
    },
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
    contacts: {
      member: 'ze@sinfo.org',
      company: 'ze@accenture.pt'
    },
    edition: 'oneEdition',
    created: new Date(),
    token: 'threeToken',
    valid: true,
    participationDays: 2,
    activities: [],
    advertisementKind: 'twoAdv'
  },
  LINK22: {
    companyId: 'threeCompany',
    contacts: {
      member: 'ze@sinfo.org',
      company: 'ze@accenture.pt'
    },
    edition: 'oneEdition',
    created: new Date(),
    token: 'fourToken',
    valid: true,
    participationDays: 2,
    activities: [],
    advertisementKind: 'twoAdv'
  },
  INVALID_LINK: {
    companyId: 'noesis',
    contacts: {
      member: 'ze@sinfo.org',
      company: 'ze@accenture.pt'
    },
    edition: 'someEdition',
    created: new Date(),
    token: 'fiveToken',
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
  STAND5: {
    topLeft: {
      x: 5,
      y: 7
    },
    bottomRight: {
      x: 6,
      y: 6
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
  },
  ACTIVITY1: {
    day: 1,
    start: new Date(),
    end: new Date(new Date().setDate(new Date().getDate() + 1))
  },
  ACTIVITY2: {
    day: 2,
    start: new Date(),
    end: new Date(new Date().setDate(new Date().getDate() + 1))
  },
  ACTIVITY3: {
    day: 3,
    start: new Date(),
    end: new Date(new Date().setDate(new Date().getDate() + 1))
  },
  ACTIVITY4: {
    day: 4,
    start: new Date(),
    end: new Date(new Date().setDate(new Date().getDate() + 1))
  },
  ACTIVITY5: {
    day: 5,
    start: new Date(),
    end: new Date(new Date().setDate(new Date().getDate() + 1))
  },
  WORKSHOP1: {
    kind: 'workshop',
    day: 1,
    start: new Date(),
    end: new Date(new Date().setDate(new Date().getDate() + 1))
  },
  WORKSHOP2: {
    kind: 'workshop',
    day: 2,
    start: new Date(),
    end: new Date(new Date().setDate(new Date().getDate() + 1))
  },
  WORKSHOP3: {
    kind: 'workshop',
    day: 3,
    start: new Date(),
    end: new Date(new Date().setDate(new Date().getDate() + 1))
  },
  WORKSHOP4: {
    kind: 'workshop',
    day: 4,
    start: new Date(),
    end: new Date(new Date().setDate(new Date().getDate() + 1))
  },
  WORKSHOP5: {
    kind: 'workshop',
    day: 5,
    start: new Date(),
    end: new Date(new Date().setDate(new Date().getDate() + 1))
  }
}
