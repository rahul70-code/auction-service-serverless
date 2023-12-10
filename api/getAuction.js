const AWS = require('aws-sdk');
import middy from '@middy/core';
import httpEventNormalizer from '@middy/http-event-normalizer';
import httpErrorHandler from '@middy/http-error-handler';
import createError from 'http-errors'

const dynamoDB = new AWS.DynamoDB.DocumentClient()


async function submit(event, context) {
    let auction;
    const { id } = event.pathParameters;

    try {
        const result = await dynamoDB.get({
            TableName: "AuctionsTable",
            Key: { id }
        }).promise();
        auction = result.Item;
    } catch (err) {
        console.error(err);
        throw new createError.InternalServerError(err)
    }

    if (!auction) throw createError.NotFound(`Auction with ID ${id} not found`)
    return {
        statusCode: 200,
        body: JSON.stringify(auction)
    }

}

export const handler = middy(submit).use(httpEventNormalizer()).use(httpErrorHandler())