import { ApiResponse, Client } from '@elastic/elasticsearch';
import { ELASTICSEARCH_URL, FILE_INDEX_NAME } from '../constants/app.constants';
import { SearchRequest, SearchResponse } from '../interfaces/search.interface';

interface ElasticsearchHitSource {
    filename: string;
    url: string;
    text: string;
}

interface ElasticsearchHit {
    _source: ElasticsearchHitSource;
    _score: number;
}

interface ElasticsearchSearchResponse {
    hits: {
        hits: ElasticsearchHit[];
    };
}

export class ElasticService {
    private client: Client;

    constructor() {
        this.client = new Client({ node: ELASTICSEARCH_URL });
    }

    async searchFiles(searchRequest: SearchRequest): Promise<SearchResponse[]> {
        const response: ApiResponse<ElasticsearchSearchResponse, unknown> = await this.client.search<ElasticsearchSearchResponse>({
            index: FILE_INDEX_NAME,
            body: {
                "query": {
                    "multi_match": {
                      "query": searchRequest.query,
                      "fields": [
                        "text",
                        "filename^2"
                      ],
                      "fuzziness": "AUTO"
                    }
                  },
                  "highlight": {
                    "fields": {
                      "text": {}
                    }
                  }
                // query: {
                //     match: {
                //         text: searchRequest.query,
                //     }
                // }                
            }
        });

        // console.log("Response: ", response.body.hits.hits);
        return response.body.hits.hits.map((hit: ElasticsearchHit) => ({
            filename: hit._source.filename,
            url: hit._source.url,
            text: hit._source.text,
            score: hit._score
        }));
    }
}
