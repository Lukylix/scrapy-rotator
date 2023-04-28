# Use a base image with the same major version as Elasticsearch
FROM docker.elastic.co/elasticsearch/elasticsearch:8.7.0

# Set environment variables
ENV discovery.type single-node
ENV network.host 0.0.0.0

# Copy the Elasticsearch configuration file
RUN rm -f /usr/share/elasticsearch/config/elasticsearch.yml
COPY elasticsearch.yml /usr/share/elasticsearch/config/

USER elasticsearch