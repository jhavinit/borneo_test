import { Client } from "@elastic/elasticsearch";
import { handleErrors } from "../utils/error.decorator";
import { logger } from "../utils/logger";
import { IFileMetadata } from "../interfaces/file.interface";
import { ELASTICSEARCH_URL, FILE_INDEX_NAME } from "../constants/app.constants";

export class ElasticService {
    private client: Client;

    constructor() {
        this.client = new Client({
            node: ELASTICSEARCH_URL,
        });
    }

    @handleErrors()
    async indexFile(filename: string, url: string, data: string): Promise<void> {
        const metadata: IFileMetadata = {
            filename, 
            url,
            text: data, 
        };

        // Index into Elasticsearch
        await this.client.index({
            index: FILE_INDEX_NAME,
            body: metadata,
        });

        logger.info(`Indexed: ${metadata.filename}`);
    };

    @handleErrors()
    async createIndex(): Promise<void> {
        const indexExists = await this.client.indices.exists({
            index: FILE_INDEX_NAME,
        });
        if (!indexExists.body) {
            await this.client.indices.create({
                index: FILE_INDEX_NAME,
                body: {
                    "settings": {
                        "index.max_ngram_diff": 7,
                      "analysis": {
                        "analyzer": {
                          "custom_analyzer": {
                            "tokenizer": "standard",
                            "filter": [
                              "lowercase",
                              "synonym_filter",
                              "ngram_filter"
                            ]
                          },
                          "search_analyzer": {
                            "tokenizer": "standard",
                            "filter": [
                              "lowercase",
                              "synonym_filter"
                            ]
                          }
                        },
                        "filter": {
                          "synonym_filter": {
                            "type": "synonym",
                            "synonyms": [
                              "hi, hello"  // Add more synonyms as needed
                            ]
                          },
                          "ngram_filter": {
                            "type": "ngram",
                            "min_gram": 3,
                            "max_gram": 10
                          }
                        }
                      }
                    },
                    "mappings": {
                      "properties": {
                        "text": {
                          "type": "text",
                          "analyzer": "custom_analyzer",
                          "search_analyzer": "search_analyzer"
                        },
                        "filename": {
                          "type": "keyword"
                        },
                        "url": {
                          "type": "keyword"
                        }
                      }
                    }
                  }
            });
            logger.info(`Created index: ${FILE_INDEX_NAME}`);
        } else {
            logger.info(`Index ${FILE_INDEX_NAME} already exists`);
        }
    }    
}
