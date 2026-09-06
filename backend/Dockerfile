FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project file and restore
COPY src/Csw.Api/Csw.Api.csproj Csw.Api/
RUN dotnet restore Csw.Api/Csw.Api.csproj

# Copy source and publish
COPY src/Csw.Api/ Csw.Api/
RUN dotnet publish Csw.Api/Csw.Api.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENTRYPOINT ["dotnet", "Csw.Api.dll"]
