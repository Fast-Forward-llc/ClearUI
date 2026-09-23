## Generate NPM Package
Publish CLearUI project
open cmd prompt to the publish folder
> `npm pack`
This will create a .tgz file that can be published to npm registry
> `npm publish <file>.tgz --registry https://registry.npmjs.org/`
copy tgz file to publicpackages project and commit & push to main

reference package in target project from public url:
`npm install https://github.com/PhilWBird/PublicPackages/raw/main/npm/clearui-1.0.0.tgz`


##Generate Nuget package
`dotnet pack -c Release`
This will create a .nupkg file in the bin/release folder that can be published to nuget.org
upload package to Github nuget registry or nuget.org
`dotnet nuget push bin\Release\ClearUI-TagHelers.1.0.0.nupkg --source clearway-github`

##Add clearway-github as nuget source with a PAT (classic)
`dotnet nuget add source https://nuget.pkg.github.com/ClearWay-Solution/index.json --name clearway-github --username USER_NAME_HERE --password YOUR_TOKEN_HERE --store-password-in-clear-text`