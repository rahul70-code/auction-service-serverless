import AWS from 'aws-sdk';

const dynamoDB = new AWS.DynamoDB.DocumentClient();

export async function closeAuction(auction) {
    const params = {
        TableName: "AuctionsTable",
        Key: {id: auction.id},
        UpdateExpression: "set #status = :status",
        ExpressionAttributeValues: {
            ":status": "CLOSED"
        },
        ExpressionAttributeNames: {
            "#status": "status"
        }
    }
    const result = await dynamoDB.update(params).promise();
    return result;
}