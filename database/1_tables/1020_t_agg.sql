create table if not exists t_agg( 
    id bigserial primary key,
    lid bigint,
    
    mac text not null,
    sid smallint not null,
    type text not null,
    description text,

    avg real,
    stddev real,
    n smallint,

    ts timestamptz not null default now(),
    --sync bool default false
);


/*

TODO: create a trigger function to be executed after each insert, which will find duplicated
lines; this might happen if the data is inserted from the remote but the response from the cloud-server
doesn't arrive to the local-server for some reason; the response will be lost after the timeout, and the sync 
field in the local table will never be changed to true (so that row will be sent again by the local server
in the next syncronization)

*/