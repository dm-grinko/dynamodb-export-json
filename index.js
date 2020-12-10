'use strict';
require('dotenv').config();
const fs = require('fs');
const { directory, region, profile } = process.env;
const AWS = require('aws-sdk');
AWS.config.credentials = new AWS.SharedIniFileCredentials({ profile });
AWS.config.update({ region });
const db = new AWS.DynamoDB({apiVersion: '2012-08-10'});
const dbClient = new AWS.DynamoDB.DocumentClient();

const getTableNames = async () => {
    return new Promise((resolve, reject) => {
        db.listTables((error, data) => {
            if (error) {
              reject(error)
            } else {
              resolve(data.TableNames);
            }
        });
    });
}

const init = async () => {
    const tableNames = await getTableNames();

    tableNames.forEach(async (TableName) => {
        const params = { TableName };
        let result = [];

        const onScan = (error, data) => {
            if (error) {
                return console.error(error);
            }

            result = result.concat(data.Items);

            if (typeof data.LastEvaluatedKey !== 'undefined') {
                params.ExclusiveStartKey = data.LastEvaluatedKey;
                dbClient.scan(params, onScan);
            } else {
                if (!fs.existsSync(directory)){
                    fs.mkdirSync(directory);
                }
                fs.writeFileSync(`${directory}/${TableName}.json`, JSON.stringify(result, null, 2));
            }
        }
        await dbClient.scan(params, onScan);
    });
}

init();
