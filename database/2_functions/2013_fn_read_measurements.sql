/* read raw data from the measurements table */


CREATE OR REPLACE FUNCTION read_measurements(options jsonb)
RETURNS SETOF t_measurements
AS $fn$

DECLARE

query text;

-- variables for input data
_table text;
_client_code text;
_age int;



BEGIN

_table       := COALESCE(options->>'table', '');
_client_code := COALESCE(options->>'clientCode', 'XXXX');
_age         := COALESCE((options->>'age')::int, 12);

-- the main query starts here

query := $$

select * from "t_%s_%s"
where now() - ts < '%s hours'
order by id desc;

$$;

query := format(query, _table, _client_code, _age);
--raise notice 'query: %', query;

RETURN QUERY EXECUTE query;

RETURN;

END;
$fn$
LANGUAGE plpgsql;


/*

select * from read_measurements('
{
	"table": "measurements",
	"clientCode": "0001",
	"age": 24
}
')

*/
