# v0.36.4 Risk Register

| Risk                                                        | Impact                                              | Mitigation                                                                     |
| ----------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------ |
| Browser-specific behavior is mistaken for framework failure | Release blocks on non-actionable engine differences | Document known limitations and keep Chromium as the default release E2E target |
| Cross-browser gate becomes flaky                            | CI signal degrades                                  | Keep failures tied to concrete search, theme, navigation, and i18n scenarios   |
| v0.36.4 broadens into product work                          | Product closure scope slips                         | Defer server/data/UI/starter/Hub work to v0.37.0                               |
| Release docs drift from package state                       | Users see stale version truth                       | Close with v0.36.5 release-truth patch evidence                                |
