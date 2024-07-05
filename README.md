# magda-embedding-api

An OpenAI embeddings API compatible microservice for Magda.

Text embeddings evaluate how closely related text strings are. They are commonly utilized for:

- Search (ranking results based on their relevance to a query)
- Clustering (grouping text strings by similarity)
- Recommendations (suggesting items with similar text strings)
- Anomaly detection (identifying outliers with minimal relatedness)
- Diversity measurement (analyzing similarity distributions)
- Classification (categorizing text strings by their most similar label)

An embedding is a vector, or a list, of floating-point numbers. The distance between two vectors indicates their relatedness, with smaller distances suggesting higher relatedness and larger distances indicating lower relatedness.

This embedding API is created for [Magda](https://github.com/magda-io/magda)'s vector / hybrid search solution. The API interface is compatible with OpenAI's `embeddings` API to make it easier to reuse existing 
 tools & libraries.
