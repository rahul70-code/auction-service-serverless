const AWS = require('aws-sdk');
import middy from '@middy/core';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import httpEventNormalizer from '@middy/http-event-normalizer';
import httpErrorHandler from '@middy/http-error-handler';
import createError from 'http-errors'
import validator from '@middy/validator';
import placeBidSchema from '../lib/schemas/placeBidSchema'
const dynamoDB = new AWS.DynamoDB.DocumentClient()


async function submit(event, context) {
    const { id } = event.pathParameters;
    const { amount } = event.body;
    const {email} = event.requestContext ? event.requestContext.authorizer : ""

    const auctionData = await dynamoDB.get({
        TableName: "AuctionsTable",
        Key: { id }
    }).promise();
    let auction = auctionData.Item;

    if(email === auction.seller) throw new createError.Forbidden("You cannot bid your own auctions!")
    
    if(email === auction.highestBid.bidder) throw new createError.Forbidden("You are already the highest bidder")

    if (auction.status != "OPEN") throw new createError.Forbidden("You cannot bid on CLOSED Auction")

    if (amount <= auction.highestBid.amount)
        throw new createError.Forbidden("Your bid must be higher than " + amount)

    const params = {
        TableName: "AuctionsTable",
        Key: { id },
        UpdateExpression: 'set highestBid.amount = :amount highestBid.bidder = :bidder',
        ExpressionAttributeValues: {
            ':amount': amount,
            ':bidder': email
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

export const handler = middy(submit)
    .use(httpJsonBodyParser())
    .use(httpEventNormalizer())
    .use(httpErrorHandler())
    .use(validator({ inputSchema: placeBidSchema, useDefaults: true }))