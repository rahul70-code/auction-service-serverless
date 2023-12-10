const AWS = require('aws-sdk');
import middy from '@middy/core';
import httpEventNormalizer from '@middy/http-event-normalizer';
import httpErrorHandler from '@middy/http-error-handler';
import createError from 'http-errors'

const dynamoDB = new AWS.DynamoDB.DocumentClient()


async function submit(event, context) {
    let auctions;
    try {
        const result = await dynamoDB.scan({
            TableName: "AuctionsTable"
        }).promise();
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

export const handler = middy(submit).use(httpEventNormalizer()).use(httpErrorHandler())