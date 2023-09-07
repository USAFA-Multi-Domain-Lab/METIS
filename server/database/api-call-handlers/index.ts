import { databaseLogger } from "../../logging";

export const filterErrors_findOne = (
  collectionName: string,
  response: any,
  callback: (document: any) => void
): ((error: any, document: any) => void) => {
  return (error: any, document: any) => {
    if (error !== null) {
      databaseLogger.error(
        `Failed to retrieve document from collection: ${collectionName}.`
      );
      databaseLogger.error(error);
      return response.sendStatus(500);
    } else if (document === null) {
      return response.sendStatus(404);
    } else {
      return callback(document);
    }
  };
};

export default {
  filterErrors_findOne,
};
