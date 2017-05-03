/* read aggregated data from the measurements table */

CREATE OR REPLACE FUNCTION read_measurements_agg(options jsonb)
RETURNS TABLE(
	ts timestamptz,
	data json
)

AS $fn$

DECLARE

query text;
json_build_object text;
time_column text;

-- variables for input data
_client_code text;
_time_interval int;
_ts_start timestamptz;
_ts_end timestamptz;
_type jsonb;
_interval_type text;
_stddev bool;


BEGIN

_client_code   := COALESCE(options->>'clientCode', 'XXXX');
_time_interval := COALESCE((options->>'timeInterval')::int, 1);
_ts_start      := COALESCE((options->>'start')::timestamptz, '2000-01-01');
_ts_end        := COALESCE((options->>'end')::timestamptz,   '2000-01-01');
_stddev        := COALESCE((options->>'stddev')::bool, false);
_interval_type := COALESCE(options->>'intervalType', 'hour');

IF jsonb_typeof((options->'type')::jsonb) = 'array' THEN
    _type := options->'type';
ELSE
    _type := jsonb_build_array(COALESCE(options->>'type',  't'));
END IF;
--raise notice '_type: %', _type;

-- the main query starts here

query := $$

with agg_by_time as (

	select 
		--date_trunc('hour', ts) as time, 
		--date_trunc('day', ts) + (date_part('hour', ts)::int / 1) * interval '1 hour' AS time,
		--date_trunc('day', ts) + (date_part('hour', ts)::int / _percentage_s) * interval '_percentage_s hour' AS time,
		--date_trunc('day', ts) + date_part('hour', ts) * interval '1 hour' + (date_part('minute', ts)::int / _percentage_s) * interval '_percentage_s minute' AS time,
		%s,

/*
the placeholder above will be replaced by something like:

		date_trunc('day', ts) + (date_part('hour', ts)::int / 12) * interval '12 hour' AS time

or

		date_trunc('day', ts) + date_part('hour', ts) * interval '1 hour' + (date_part('minute', ts)::int / 10) * interval '10 minute' AS time
*/
		mac, 
		sid, 
		type, 
		round(avg(val)::numeric, 2) as val_avg,
		round(stddev_pop(val)::numeric, 2) as val_stddev,
		count(val)::smallint as val_count
	from t_measurements_%s

	where
		val > (case 
			when type = 't' then -99999  /* min temperature */
			when type = 'h' then -99999  /* min humidity */
			else -99999
			end)
		and 
		val < (case 
			when type = 't' then 99999  /* max temperature */
			when type = 'h' then 99999  /* max humidity */
			else 99999
			end)
		and ts >= $1 and ts <= $2
		--and type = $3
		--and to_jsonb(type) <@ '["h", "t"]'::jsonb
		and to_jsonb(type) <@ $3
			
	group by time, mac, sid, type
	order by time
)
select 
	time as ts, 
	json_agg(

		%s

/*
the placeholder above will be replaced by something like:

		json_build_object(
			'key', mac || ':' || sid || ':' || type, 
			'val_avg', val_avg
		)


note that the 'key' property is formed by a combination of (mac, sid, type), 
which identifies uniquely the location of the measurement; 
that is, it will be something like "18-fe-34-d3-83-85:2:t"
*/

	) as data
from agg_by_time
group by time
order by time;

$$;

-- process the interval type

IF _interval_type = 'minute' THEN

time_column := $$

	date_trunc('day', ts) + date_part('hour', ts) * interval '1 hour' + (date_part('minute', ts)::int / %s) * interval '%s minute' AS time

$$;

ELSE 

time_column := $$

	date_trunc('day', ts) + (date_part('hour', ts)::int / %s) * interval '%s hour' AS time

$$;

END IF;

time_column := format(time_column, _time_interval, _time_interval);
raise notice 'time_column %', time_column;


-- process the json_build_object string

IF _stddev = true THEN

-- include stddev and count in the output
json_build_object := $$

	json_build_object(
		'key', mac || ':' || sid || ':' || type, 
		'val_avg', val_avg, 
		'val_count', val_count,
		'val_stddev', val_stddev
	)

$$;

ELSE 

json_build_object := $$

	json_build_object(
		'key', mac || ':' || sid || ':' || type,
		'val_avg', val_avg
	)

$$;

END IF;

-- process the final query string

query := format(query, time_column, _client_code, json_build_object);

RETURN QUERY EXECUTE query
USING
	_ts_start,
	_ts_end,
	_type;

RETURN;

END;
$fn$
LANGUAGE plpgsql;


/*

Example: 

select * from read_measurements_agg('{ 
	"clientCode": "0001", 
	"timeInterval": 6, 
	"start": "2016-07-25", 
	"end": "2016-07-27"
}')

Example: 

select * from read_measurements_agg('{ 
	"clientCode": "0001", 
	"timeInterval": 6, 
	"start": "2016-07-25", 
	"end": "2016-07-27", 
	"stddev": true
}')


Example: with 1 measurement type (given as a string); will return records with type "h"

select * from read_measurements_agg('{ 
	"clientCode": "0001", 
	"timeInterval": 1, 
	"start": "2017-01-12", 
	"end": "2017-01-13",
	"stddev": true,
	"type": "h"
}')


Example: with 2 measurement types (given as an array); will return records with type "t" or "h"

select * from read_measurements_agg('{ 
	"clientCode": "0001", 
	"timeInterval": 1, 
	"start": "2017-01-12", 
	"end": "2017-01-13",
	"stddev": true,
	"type": ["h", "t"]
}')

Example: same as the above, but with interval type as minute

select * from read_measurements_agg('{ 
	"clientCode": "0001", 
	"timeInterval": 1, 
	"intervalType": "minute",
	"start": "2017-01-12", 
	"end": "2017-01-13",
	"stddev": true,
	"type": ["h", "t"]
}')
*/
