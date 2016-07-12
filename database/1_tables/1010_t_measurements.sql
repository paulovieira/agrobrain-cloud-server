
create table if not exists t_measurements(
	id int primary key,

	mac text not null,
    sid smallint not null,
    type text not null,
    description text,
    val real,

    ts timestamptz not null default now(),
    battery smallint,
    agg bool default false
);

