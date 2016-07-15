
create table if not exists t_agg(
    id int primary key,
    
    mac text not null,
    sid smallint not null,
    type text not null,
    description text,
    avg real,
    stddev real,
    n smallint,

    ts timestamptz not null default now(),
    battery smallint,
    sync jsonb default '{}'
);

