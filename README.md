## Auction service
Auction service is used to auction the highest bid by users using the place bid Api. Auction crud to create get, update and place the bid. The APIs are created using AWS serverless lambda functions.

Table of contents
=================


   * [Installation](#installation)
   * [AWS Configurations](#awscon)
   * [Serverless.yaml](#serverless)
   * [Auction Endpoints](#endpoints)
   * [DynamoDB](#dynamodb)
   * [Validations](#validations)
   * [Auth Middleware](#middleware)
   * [To be continued - Notification service and Auction picture using S3](#continue)
    

Installation
============

Make sure to install node.js version 16 or less and npm.

```
node --version
```

Serverless 
```bash
$ npm install -g serverless
```


AWS Configurations
===================

- Create AWS Account.
- Create a user using IAM (identity and access management) service.
- give programmatic and aws management console access to the user.
- Also give Administrator access to the user.
- create access id for that user.
- login using access id and access secret in the cmd
```
aws configure
```
- we can now access AWS services like lambda functions, DynamoDB, S3 and other services in the Node.js app using that user.
- Add budget in the account to ensure it will not exceed for free tier.


Serverless Template
====================

- Use [codingly](https://github.com/arielweinberger/sls-base) link as a boilerplate code to start writing node.js aws serverless lambda functions.
- To create auction-service using serverless lambda node.js
```
$ sls create --name auction-service --template-url https://github.com/codingly-io/sls-base
$ cd auction-service
$ npm install
```

Serverless.yaml
=============
serverless.yaml file use to create cloud formation and initializing resources which we need to create lambda functions.

- service - cloud formation stack. we can use multiple stack prefix like auction-service-dev, auction-service-stg, auction-service-prod.
- plugins - plugins used serverless-bundle for bundling the resources using webpack.
- provider - name, runtime, region, iamrolestatements are used cloudformation.
- resources - resources like dynamodb tables, indexes.
- functions - lambda functions defined here. with http, schedule, ws etc.


Auction Endpoints
================
There are 5 functions used in the auction-service.

## createAuction
- Here auction are created with title, status: open/close, createdAt, endingAt, highestBid which will then inserted into Auctions table.
- Middlewares are used to parse event body, http error handler, validator.
- iamRoleStatements - Action added as dynamodb:PutItem to provide access to upsert the data for that user. Also, arn added for the auctions table.

You can try the live url for create auction here
```
https://f8p7ulnbf8.execute-api.eu-west-1.amazonaws.com/dev/auctions
```

## getAuctions
- Fetch the auctions using query - status= OPEN/CLOSE.
- Query created for dynamodb - TableName, IndexName for faster retrival, KeyConditionExpression - which is matching the conditions, ExpressionAttributeValue and ExpressionAttributeName are used to fetch dyanmic values from KeyConditionExpression.
- return the result.

You can try the live url for fetching the auctions here
```
https://f8p7ulnbf8.execute-api.eu-west-1.amazonaws.com/dev/auction
```

## getAuction
- fetch auctionId (id) from event.pathParameters
- get the data by id in dynamodb table.
- return the result

You can try the live url for getting auction by id here
```
https://f8p7ulnbf8.execute-api.eu-west-1.amazonaws.com/dev/auction/{id}
```

## placeBid
- fetch id from event.pathParameters and amount from event.body.
- fetch the auction by id.
- if auction is closed return forbidden error (cannot place bid on closed auction).
- if bid amount is less than highestBid.amount return forbidden.
- else update operation highestBid.amount=amount.
- return the result.
You can try the live url for placing the bid here

```
https://f8p7ulnbf8.execute-api.eu-west-1.amazonaws.com/dev/auction/{id}/bid
```

## processAuctions
- scheduler event used for closing the auctions at set interval.
- it fetches the auctions which are open and endingAt <= now.
- it closes the auctions using closeAuction event.
- return the closed auctions count.

## closeAuction
- event to update the status from open to close.

DynamoDB
===========
- We have defined resources -> AuctionsTable -> AWS::DynamoDB::Table where attribute definitions, key schema, global secondary indexes used.
- statusAndEndingAt index created using status (partition key) and endingAt (sorting key) 
- More on partition and sorting key [Here](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.CoreComponents.html)


Validations
============

Validations added using middy middleware
```
npm install @middy/validator
```

It will validate the queryParameters, body and pathParameters. Check /lib/schemas/ for event validations. Also added as middleware in each event.


Auth Middleware
==============
User sends API request POST /auction with Auth token to API Gateway. API gateway in turn send it to authorizer if token proper it will send request to lambda createAuction function and return response from the function.

Auth0 is used for authorizer as a middleware. 
- [Here](https://auth0.com/signup?place=header&type=button&text=sign%20up) you can signup for Auth0
- create user on Auth0 - to get the access_token.
- Fetch the access_token from the below curl.
```
curl --location --request POST 'https://YOUR_AUTH0_DOMAIN/oauth/token' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode 'client_id=YOUR_AUTH0_CLIENT_ID' \
--data-urlencode 'username=YOUR_USERNAME' \
--data-urlencode 'password=YOUR_PASSWORD' \
--data-urlencode 'grant_type=password' \
--data-urlencode 'scope=openid'
```
- Create auth-service using [this](https://github.com/arielweinberger/serverless-auth0-authorizer) repository and deploy the lambda events of auth on same AWS account.
- use arn of auth-service in auction-service to get authenticated using access_token get it from the api.
- we can now attach the bidder information in the placeBid event to know the bidder and seller (createAuction) event.

