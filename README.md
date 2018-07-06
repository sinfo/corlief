# corlief

## Objective

Create an application that allows companies to book stands on SINFO's venue, as well as send all the information required.

## Use case

1. SINFO's member contacts the company
2. Company agrees to participate on SINFO, with package X, giving them 2 days of stand, 1 presentation and 1 workshop
3. Member fills a contract page from this app, indicating the company, package and all the info that is required from the company (for example, logo, presentation's and workshop's info, and finally tax info)
4. A unique and distintive link is created for this company, which is sent to them
5. The company can now, using this link, make reservations for the stands and fill the information required by SINFO

## Structure

The application will be divided in 2 parts: and administration page (accessible by any SINFO's member), and a company page (unique to each company).

## Database

links

```json
{
    companyId: string,
    edition: string,
    created: date,
    token: string,
    valid: boolean,
    participationDays: number,
    activities: [{
        kind: string,
        date: date
    }],
    advertisementKind: string
}
```

venues

```json
{
    edition: string,
    image: string,
    stands: [{
        id: number,
        pos1: {
            x: number,
            y: number
        },
        pos2: {
            x: number,
            y: number
        }
    }]
}
```

reservations

```json
{
    companyId: string,
    edition: string,
    stands: [{
        day: number,
        standId: number,
        reservationdate: date
    }]
}
```

data

```json
{
    companyId: string
    edition: string,
    logo: string,
    activities: [{
        kind: string,
        date: {
            opt1: date,
            opt2: date
        },
        title: string,
        description: string,
        speakers: [{
            name: string,
            position: string
        }]
    }],
    invoice: {
        name: string,
        address: string,
        taxId: string,
        price: number,
        notes: string,
        invoiceId: string,
        emissiondate: date,
        file: string
    }
}
```