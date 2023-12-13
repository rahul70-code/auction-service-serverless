const AWS = require('aws-sdk');
import middy from '@middy/core';
import httpEventNormalizer from '@middy/http-event-normalizer';
import httpErrorHandler from '@middy/http-error-handler';
import createError from 'http-errors'
import validator from '@middy/validator';
import getAuctionsSchema from "../lib/schemas/getAuctionsSchema"
const dynamoDB = new AWS.DynamoDB.DocumentClient()


async function submit(event, context) {
    const { status } = event.queryStringParameters;
    let auctions;
    try {
        const params = {
            TableName: "AuctionsTable",
            IndexName: "statusAndEndDate",
            KeyConditionExpression: "#status = :status",
            ExpressionAttributeValues: {
                ":status": status,
            },
            ExpressionAttributeNames: {
                "#status": "status"
            }
        }
        const result = await dynamoDB.query(params).promise();
        auctions = result.Items;
    } catch (err) {
        console.error(err);
        throw new createError.InternalServerError(err)
    }
    return {
        statusCode: 200,
        body: JSON.stringify(auctions)
    }

}

export const handler = middy(submit).use(httpEventNormalizer()).use(httpErrorHandler()).use(validator({ inputSchema: getAuctionsSchema, useDefaults: true }))