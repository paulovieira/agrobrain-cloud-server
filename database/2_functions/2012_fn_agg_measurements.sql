
CREATE OR REPLACE FUNCTION agg_measurements(options jsonb)
--RETURNS SETOF t_measurements
RETURNS TABLE(
	ts timestamptz,
	data json
)

AS $$

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

query := $_$
	/* begin dynamic query */

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
				'key', mac || '_' || sid || '_' || type, 
				'val_avg', val_avg, 
				'val_count', val_count
			)
*/

			-- note that the 'key' property is formed by a combination of (mac, sid, type), 
			-- which identifies uniquely the location of the measurement

		) as data
	from agg_by_time
	group by time
	order by time;

	/* end dynamic query */
$_$;


IF _stddev = true THEN

	-- include stddev and count in the output
	json_build_object := $_$

				json_build_object(
					'key', mac || '_' || sid || '_' || type, 
					'val_avg', val_avg, 
					'val_count', val_count,
					'val_stddev', val_stddev
				)

	$_$;

	query := format(query, _time_interval, _time_interval, _client_code, json_build_object);

ELSE 

	json_build_object := $_$

				json_build_object(
					'key', mac || '_' || sid || '_' || type,
					'val_avg', val_avg
				)

	$_$;

	query := format(query, _time_interval, _time_interval, _client_code, json_build_object);

END IF;


RETURN QUERY EXECUTE query
USING
	_ts_start,
	_ts_end;

RETURN;

END;
$$
LANGUAGE plpgsql;


/*

select * from agg_measurements('{ 
	"clientCode": "0001", 
	"timeInterval": 6, 
	"start": "2016-07-25", 
	"end": "2016-07-27"
}')

select * from agg_measurements('{ 
	"clientCode": "0001", 
	"timeInterval": 6, 
	"start": "2016-07-25", 
	"end": "2016-07-27", 
	"stddev": true
}')

*/
