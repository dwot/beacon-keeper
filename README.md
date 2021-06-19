beacon-keeper
===========

beacon-keeper is a prototype discord bot built with discord.js.

beacon-keeper works with [twilio](https://www.twilio.com/) to send text or call alerts to a call list when invoked by a 
discord command.

To run, establish an .env file with your environment variables for twilio, discord, etc.  

Establish a list.csv with entries to be contacted consisting of:

* Name
* Organization
* T or C for text or call notification
* Number to be contacted

ex.: 
Conan,Barbarians Inc,T,15555551212
