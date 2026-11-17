# Shift inventory builds

For a development build, open **Actions > Build ox_inventory**, select a successful run for the intended commit, and download the **ox_inventory** artifact. Unpack the Actions artifact to obtain ox_inventory.zip.

For an official build, download the ox_inventory.zip asset from the GitHub Release. Extract it into the server resources directory. Back up the existing resource and reconcile server-specific item definitions and images before replacing it. Start oxmysql and ox_lib first and follow the upstream framework startup order.

Restrict creation and modification of shift-v* tags to authorized maintainers in GitHub rulesets. After reviewing a passing build, tag the intended commit using the manifest version, for example shift-v2.45.0-r1. The final number is the Shift revision. The workflow builds that exact commit and preserves the upstream manifest version.

The upstream check posts a read-only GitHub Actions summary. Review changes from Samuels-Development before merging or porting them.
