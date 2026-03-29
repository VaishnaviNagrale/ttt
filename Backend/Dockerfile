FROM heroiclabs/nakama:3.16.0

COPY ./nakama/local.yml /nakama/data/local.yml

CMD ["sh", "-c", "nakama --config /nakama/data/local.yml --database.address $DATABASE_ADDRESS"]