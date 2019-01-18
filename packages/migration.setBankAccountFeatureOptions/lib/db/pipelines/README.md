### [Agregator Pipelines](https://docs.mongodb.com/manual/core/aggregation-pipeline/)

An aggregator pipeline is a series of operations that retrieve and transform data in various ways. Each stage of the pipeline is performed in order and have access to various operations depending on the type of stage.
___
#####WARNING
Aggregation has limitations, and there are things to be wary of; always check the documentation. But always remember a few specifics:

 * document size: at any point in the pipeline a single document MUST NOT exceed 16mb. This limit applies to:
   * the pipeline query itself
   * any document pulled from the db
   * any document that results from an aggregation stage
 * memory usage: aggregator pipelines are restricted by default to 100mb of memory. If your query is likely to exceed this, you need to specify **allowDiskUse: true**
 * version: The stages and operations available to the aggregation pipeline are dependent on MongoDB version. Always check the documentation to ensure the stage/operation you want is supported. A quick way to check the current version of MongoDB is **db.version();**
___

Note: Some of the pipeline looks a little unwieldy, but it's mainly because Mongo 3.2 can only project by INCLUDING the fields
we want, newer versions can project by EXCLUDING the fields we don't want, and that would reduce this pipeline quite a lot

A few things that will be relevant when understanding this pipeline:

 * [stages](https://docs.mongodb.com/manual/reference/operator/aggregation-pipeline/): 
 		A pipeline stage is an action that will occur on a document. A pipeline is made up of multiple stages, each of which manipulate the documents currently available.
   * $match: find documents from the collection (if it's the first entry in the pipeline) or from the current results
            which 'match' the given query
   * $project: modify each document from the current results so that it includes the fields described
 * [operators](https://docs.mongodb.com/manual/reference/operator/aggregation/)