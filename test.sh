#!/bin/bash

curl -s --user 'api:key-7jm1c009ezjv85pkm1rqfxevufeovb43' \
    https://api.mailgun.net/v3/sinfo.org/messages \
    -F from='Excited User <mailgun@sinfo.org>' \
    -F to=diogo.pacheco@sinfo.org \
    -F subject='Hello' \
    -F text='Testing some Mailgun awesomeness!'
