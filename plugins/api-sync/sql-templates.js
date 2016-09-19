'use strict';

module.exports.getRecords = function getRecords(clientCode, table, age){

    var sql = `

select * from "t_${ table }_${ clientCode }"
where now() - ts < '${ age } hours'
order by id desc;

    `;

    return sql;

};