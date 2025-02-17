{
  description = "Earn development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/master";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system: let
      pkgs = nixpkgs.legacyPackages.${system};
      
      prisma-6_3 = pkgs.prisma-engines.overrideAttrs (oldAttrs: rec {
        version = "6.3.0";
        src = pkgs.fetchFromGitHub {
          owner = "prisma";
          repo = "prisma-engines";
          rev = "acc0b9dd43eb689cbd20c9470515d719db10d0b0";
          sha256 = "sha256-gQLDskabTaNk19BJi9Kv4TiEfVck2QZ7xdhopt5KH6M=";
        };
        cargoHash = "";
      });
    in {
      devShell = pkgs.mkShell {
        nativeBuildInputs = [ pkgs.bashInteractive ];
        buildInputs = with pkgs; [
          nodejs_20
          nodePackages.pnpm
          mysql80
          openssl
          pkg-config
          prisma-6_3
          zlib
        ];

        shellHook = ''
          export PRISMA_SCHEMA_ENGINE_BINARY="${prisma-6_3}/bin/schema-engine"
          export PRISMA_QUERY_ENGINE_BINARY="${prisma-6_3}/bin/query-engine"
          export PRISMA_QUERY_ENGINE_LIBRARY="${prisma-6_3}/lib/libquery_engine.node"
          export PRISMA_INTROSPECTION_ENGINE_BINARY="${prisma-6_3}/bin/introspection-engine"
          export PRISMA_FMT_BINARY="${prisma-6_3}/bin/prisma-fmt"
          
          # Set environment variables for MySQL
          export MYSQL_HOST=localhost
          export MYSQL_PORT=3306
          export MYSQL_USER=earn
          export MYSQL_PASSWORD=earnpassword
          export MYSQL_DATABASE=earn

          echo "Node.js development environment loaded!"
          echo "MySQL is configured with:"
          echo "  Host: $MYSQL_HOST"
          echo "  Port: $MYSQL_PORT"
          echo "  User: $MYSQL_USER"
          echo "  Database: $MYSQL_DATABASE"
        '';

        # Add any additional environment variables needed
        DATABASE_URL = "mysql://earn:earnpassword@localhost:3306/earn";
      };
    });
} 
