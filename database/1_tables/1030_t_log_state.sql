
create table if not exists t_log_state( 
    id serial primary key,

    event jsonb,
    ts_start timestamptz not null default now(),
    ts_end timestamptz not null default now(),

    sync jsonb default '{}'
);