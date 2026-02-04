### Helpers
These files contain separated logic as the main file was getting really large.
The files are divided into validator.py for validating JSON response data, dbutils.py
containing all that is needed to initialize, query and insert into the database, and
finally, the get_request_bodies file that generate all request bodies that are used 
for the archival project.

#### Response validation
All JSON responses are validated against a local model. The validation is configured
to be very loose, as all keys and values in the response are not relevant for the
functionality of this script. However, the validation can be tightened if necessary
for different purposes by removing the "extra: ignore" from the configurations. 

#### Get request bodies
This file contains the different requests that are made throughout the backup process,
the requests are dynamically generated depending on the parameters (limit, offset, id)

### Re-using the script for different channels
As configured this script will fetch metadata for all videos under a single channel
hosted on https://banned.video. In the main.py file there are configurable parameters
at the top of the doucment that can be used to backup other channels.