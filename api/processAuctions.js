import { getEndedAuctions } from "../lib/getEndedAuctions"
import { closeAuction } from "./closeAuctions";
import createError from 'http-errors';

const dynamoDB = new AWS.DynamoDB.DocumentClient()


async function submit(event, context) {
  try {
    const auctionsToClose = await getEndedAuctions();
    const closePromises = auctionsToClose.map(auction => closeAuction(auction));
    await Promise.all(closePromises);
    return { closed: closePromises.length }
  } catch(err) {
    console.error(err);
    throw new createError.InternalServerError(err)

  }
}

export const handler = middy(submit).use(httpEventNormalizer()).use(httpErrorHandler())