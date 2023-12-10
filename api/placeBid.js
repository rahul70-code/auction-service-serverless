const AWS = require('aws-sdk');
import middy from '@middy/core';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import httpEventNormalizer from '@middy/http-event-normalizer';
import httpErrorHandler from '@middy/http-error-handler';
import createError from 'http-errors'

const dynamoDB = new AWS.DynamoDB.DocumentClient()


async function submit(event, context) {
    const { id } = event.pathParameters;
    const { amount } = event.body;
    const params = {
        TableName: "AuctionsTable",
        Key: { id },
        UpdateExpression: 'set highestBid.amount = :amount',
        ExpressionAttributeValues: {
            ':amount': amount
        },
        ReturnValues: "ALL_NEW"
    }
    let updateAuction;

    try {
        const result = await dynamoDB.update(params).promise();
        updateAuction = result.Attributes;
    } catch (err) {
        console.error(err);
        throw new createError.InternalServerError(err)
    }

    return {
        statusCode: 200,
        body: JSON.stringify(updateAuction)
    }

}

export const handler = middy(submit).use(httpJsonBodyParser()).use(httpEventNormalizer()).use(httpErrorHandler())