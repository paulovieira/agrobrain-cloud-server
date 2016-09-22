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

-- variables for input data
_client_code text;
_time_interval int;
_ts_start timestamptz;
_ts_end timestamptz;
_stddev bool;



BEGIN

_client_code   := COALESCE(options->>'clientCode', 'XXXX');
_time_interval := COALESCE((options->>'timeInterval')::int, 1);
_ts_start      := COALESCE((options->>'start')::timestamptz, '2000-01-01');
_ts_end        := COALESCE((options->>'end')::timestamptz,   '2000-01-01');
_stddev        := COALESCE((options->>'stddev')::bool, false);

-- the main query starts here

query := $$

with agg_by_time as (

	select 
		--date_trunc('hour', ts) as time, 
		--date_trunc('day', ts) + (date_part('hour', ts)::int / 1) * interval '1 hour' AS time,
		date_trunc('day', ts) + (date_part('hour', ts)::int / %s) * interval '%s hour' AS time,
		mac, 
		sid, 
		type, 
		round(avg(val)::numeric, 2) as val_avg,
		round(stddev_pop(val)::numeric, 2) as val_stddev,
		count(val)::smallint as val_count
	from t_measurements_%s

	where
		val > (case 
			when type = 't' then -10
			when type = 'h' then -1
			else -99999
			end)
		and 
		val < (case 
			when type = 't' then 60
			when type = 'h' then 101
			else 99999
			end)
		and ts >= $1 and ts <= $2
			
	group by time, mac, sid, type
	order by time
)
select 
	time as ts, 
	json_agg(

		%s
		
		-- the placeholder above will be replaced by something like:

/*
		json_build_object(
			'key', mac || ':' || sid || ':' || type, 
			'val_avg', val_avg
		)
*/

		-- note that the 'key' property is formed by a combination of (mac, sid, type), 
		-- which identifies uniquely the location of the measurement; that is, it will
		-- be something like "18-fe-34-d3-83-85:2:t"

	) as data
from agg_by_time
group by time
order by time;

$$;


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


query := format(query, _time_interval, _time_interval, _client_code, json_build_object);

RETURN QUERY EXECUTE query
USING
	_ts_start,
	_ts_end;

RETURN;

END;
$fn$
LANGUAGE plpgsql;


/*

select * from read_measurements_agg('{ 
	"clientCode": "0001", 
	"timeInterval": 6, 
	"start": "2016-07-25", 
	"end": "2016-07-27"
}')

select * from read_measurements_agg('{ 
	"clientCode": "0001", 
	"timeInterval": 6, 
	"start": "2016-07-25", 
	"end": "2016-07-27", 
	"stddev": true
}')

*/
