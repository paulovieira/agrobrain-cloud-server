'use strict';

module.exports.upsertAgg = function upsertAgg(clientCode, data){

    let sql = '';

    if (data.length === 0){

        // make a query that won't change anything and that returns no rows
        sql = `

UPDATE "t_agg_${ clientCode }" 
set id = -1
where id = -1;

        `;

        return sql;
    }

    sql = `

INSERT INTO "t_agg_${ clientCode }" (
    id,
    mac, 
    sid,
    type,
    description,
    avg,
    stddev,
    n,
    ts,
    battery
)
VALUES

    `;

    let i = 0;
    const l = data.length;
    for (; i < l; ++i){

        sql += `
(
     ${ data[i]['id']         },
    '${ data[i]['mac']        }',
     ${ data[i]['sid']        },
    '${ data[i]['type']       }',
    '${ data[i]['description']       }',
     ${ data[i]['avg']        },
     ${ data[i]['stddev']     },
     ${ data[i]['n']          },
    '${ data[i]['ts']         }',
     ${ data[i]['battery']    }
),
        `;
    }

    // remove the comma in the tail (we know l > 0)
    sql = sql.trim().slice(0, -1);

    // it might happen that the row is already in the table (but the 'sync' flag wasn't set to true
    // in the local database)
    sql += `

ON CONFLICT (id) DO UPDATE SET 
    mac         = EXCLUDED.mac,
    sid         = EXCLUDED.sid,
    type        = EXCLUDED.type,
    description = EXCLUDED.description,
    avg         = EXCLUDED.avg,
    stddev      = EXCLUDED.stddev,
    n           = EXCLUDED.n,
    ts          = EXCLUDED.ts,
    battery     = EXCLUDED.battery

RETURNING id;
`;

    return sql;
};


module.exports.upsertMeasurements = function upsertMeasurements(clientCode, data){

    let sql = '';

    if (data.length === 0){

        // make a query that won't change anything and that returns no rows
        sql = `

UPDATE "t_agg_${ clientCode }" 
set id = -1
where id = -1;

        `;

        return sql;
    }

    sql = `

INSERT INTO "t_measurements_${ clientCode }" (
    id,
    mac, 
    sid,
    type,
    description,
    val,
    ts,
    battery,
    agg
)
VALUES

    `;

    let i = 0;
    const l = data.length;
    for (; i < l; ++i){

        sql += `
(
     ${ data[i]['id']         },
    '${ data[i]['mac']        }',
     ${ data[i]['sid']        },
    '${ data[i]['type']       }',
    '${ data[i]['description']       }',
     ${ data[i]['val']        },
    '${ data[i]['ts']         }',
     ${ data[i]['battery']    },
     ${ data[i]['agg']        }
),
        `;
    }

    // remove the comma in the tail (we know l > 0)
    sql = sql.trim().slice(0, -1);

    // it might happen that the row is already in the table (but the 'sync' flag wasn't set to true 
    // in the local database)
    sql += `

ON CONFLICT (id) DO UPDATE SET 
    mac         = EXCLUDED.mac,
    sid         = EXCLUDED.sid,
    type        = EXCLUDED.type,
    description = EXCLUDED.description,
    val         = EXCLUDED.val,
    ts          = EXCLUDED.ts,
    battery     = EXCLUDED.battery,
    agg         = EXCLUDED.agg

RETURNING id;
`;

    return sql;
};

module.exports.getRecords = function getRecords(clientCode, table, age){

    var sql = `

select * from "t_${ table }_${ clientCode }"
where now() - ts < '${ age } hours'
order by id desc;

    `;

    return sql;

};