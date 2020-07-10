# corlief 2.0 - Now with activities!

Changelog:
  + Venue now has an array of workshops and presentations, which are activities and are represented as
  ```{id: Number, day: Number, start: Date, end: Date}``` :heavy_check_mark:
  + Venues have 6 new endpoints, POST, DELETE and PUT for /venue/workshop and for /venue/presentation :heavy_check_mark:
  + Links now have 2 additional boolean fields, workshop and presentation. These represent wheter or not that company can make a reservation for a workshop and/or presentation :heavy_check_mark:
  + Links have no new endpoint but POST and PUT have been modified to accomodate the new changes
  + Reservations now have 2 additional optional fields, workshop and presentation, and are represented by the activity id.
  + As with the links, no new endpoints have been made but changes to previously existing ones, such as POST and PUT, were made
   
