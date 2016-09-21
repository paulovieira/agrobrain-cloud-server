
CREATE OR REPLACE FUNCTION upsert_measurements(data jsonb, options jsonb)
RETURNS SETOF t_measurements
AS $fn$

DECLARE
new_row t_measurements%rowtype;
query text;

-- variables for input data
_client_code text;

BEGIN

IF  jsonb_typeof(data) = 'object' THEN
    data := jsonb_build_array(data);
END IF;

_client_code := coalesce(options->>'clientCode', 'XXXX');

query := $$
    /* begin dynamic query */

   insert into %I(
        id,
        mac, 
        sid,
        type,
        description,
        val,
        ts,
        battery
    )
    values ($1, $2, $3, $4, $5, $6, $7, $8)
    on conflict (id) do update set
        id          = excluded.id,
        mac         = excluded.mac,
        sid         = excluded.sid,
        type        = excluded.type,
        description = excluded.description,
        val         = excluded.val,
        ts          = excluded.ts,
        battery     = excluded.battery
    returning *; 

    /* end dynamic query */
$$;

-- use specific table
query := format(query, 't_measurements_' || _client_code);

for new_row in (select * from jsonb_populate_recordset(null::t_measurements, data)) loop

    execute query
        into strict new_row
        using 
            new_row.id,
            new_row.mac,
            new_row.sid,
            new_row.type,
            new_row.description,
            new_row.val,
            new_row.ts,
            new_row.battery;

    return next new_row;

end loop;

return;

END;
$fn$
LANGUAGE plpgsql;


/*

select * from upsert_measurements(' 
  {
    "id": 999999,
    "mac": "xx-aa",
    "sid": 123,
    "type": "h",
    "description": "desc",
    "val": 20.1,
    "ts": "2016-09-17T15:22:50.570Z",
    "battery": null
  }
',
'{ "clientCode": "0001" }'
);


select * from upsert_measurements('[
  {
    "id": 888888,
    "mac": "xx-aa",
    "sid": 123,
    "type": "h",
    "description": "desc",
    "val": 20.1,
    "ts": "2016-09-17T15:22:50.570Z",
    "battery": null
  },
  {
    "id": 888889,
    "mac": "xx-bb",
    "sid": 124,
    "type": "h",
    "description": "desc",
    "val": 20.2,
    "ts": "2016-09-17T15:23:50.570Z",
    "battery": null
  }
]',
'{ "clientCode": "0001" }'
);

*/