const { v4: uuid } = require('uuid')
const AWS = require('aws-sdk');
import middy from '@middy/core';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import httpEventNormalizer from '@middy/http-event-normalizer';
import httpErrorHandler from '@middy/http-error-handler';
import createError from 'http-errors'

const dynamoDB = new AWS.DynamoDB.DocumentClient()


async function submit(event, context) {
    const { title } = event.body;
    const now = new Date()
    const auction = {
        id: uuid(),
        title,
        status: "OPEN",
        createdAt: now.toISOString(),
        highestBid: {
            amount: 0   
        }
    }

    try {
        await dynamoDB.put({
            TableName: "AuctionsTable",
            Item: auction,
        }).promise()
    } catch (err) {
        console.error(err);
        throw new createError.InternalServerError(err)
    }

    return {
        statusCode: 201,
        body: JSON.stringify(auction)
    }

}

export const handler = middy(submit).use(httpJsonBodyParser()).use(httpEventNormalizer()).use(httpErrorHandler())