import AWS from "aws-sdk";

const dynamoDB = new AWS.DynamoDB.DocumentClient();

export async function getEndedAuctions() {
    const now = new Date();
    const params = {
        TableName: "AuctionsTable",
        IndexName: "statusAndEndDate",
        KeyConditionExpression: "#status = :status AND endingDate <= :now",
        ExpressionAttributeValues: {
            ":status": "OPEN",
            ":now": now.toISOString()
        },
        ExpressionAttributeNames: {
            "#status": "status"
        }
    }

    const result = await dynamoDB.query(params).promise();
    return result.Items;
}