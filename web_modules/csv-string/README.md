This is the 'csv-string' module from NPM. More info at

https://github.com/Inist-CNRS/node-csv-string

The code was commented to avoid requiring the 'stream' module, which is used only for methods that we don't care, and which would make the lib chunk around 100k bigger than necessary.