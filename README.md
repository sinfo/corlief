# corlief 2.1 - Now with activities and optional Stands!

Changelog:
  + Venue now has an array of workshops, presentations and lunch talks, which are activities and are represented as
  ```{id: Number, day: Number, start: Date, end: Date}``` 
  + Venues have 6 new endpoints, POST, DELETE and PUT for /venue/workshop and for /venue/presentation 
  + Links now have additional boolean fields to account for activities. These represent wheter or not that company can make a reservation for a that activity 
  + Links have no new endpoint but POST and PUT have been modified to accomodate the new changes :heavy_check_mark:
  + Reservations now have additional optional fields for the activities and are represented by the activity id. 
  + As with the links, no new endpoints have been made for reservations but changes to previously existing ones, such as POST and PUT, were made 
  + A venue with no stands is now supported! In this situation, stands are assumed to be limitless and companies can make a reservation just by submitting the day.
  
