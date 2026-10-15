# Outline and review record — v1.0.0
Audience: programmers familiar with Java or C#; no Spring expertise assumed.
Objective mapping: O1 distinguish IoC/DI/DIP/callback (sections 3,5,7; exercise 5); O2 demonstrate test seam (1,2; exercises 1,2); O3 date framework transitions (3,4; exercise 3); O4 compose XML/annotations/.NET (4,5; exercise 4); O5 diagnose lifetime ownership (6; exercise 6); O6 choose container conditionally (7,8; decision experiment).
Outline v0: direct construction → DI → container → lifetimes → tradeoffs.
Subject-matter pass: added earlier control-flow framework heritage, distinction between DI/DIP, careful dates, service locator and external ownership.
Learner pass: moved manual constructor injection before Spring so historical syntax cannot masquerade as the concept; one recurring checkout example.
Instructional-design pass: added a no-network browser injection model, identity-based scope model, six reasoned checks, copyable source and one decision experiment.
Five post-implementation desk reviews:
1. Accuracy: confirmed Spring dates and Fowler sources; 1970s explicitly background rather than a precision-origin claim.
2. Pedagogy: baseline problem precedes architecture; concepts defined after working example.
3. Failure handling: failing mock, ambiguous bean, captive scope, disposal guidance included.
4. UI: semantic headings, labeled controls, focus styling, reduced-motion and color-scheme support; interactive UI not yet cross-browser tested.
5. Reproducibility: standalone app/index.html with no external scripts; catalog metadata conforms to CONTRIBUTING; catalog build not yet run in GitHub environment.
Outstanding: run full catalog CI and actual Spring/.NET compilation; browser automation and keyboard audits.

## v1.1.0 runner integration review
- Reused established csharp-worker.js from the Java Futures lesson, leaving its runtime files in one place rather than duplicating ~21 MB of binaries.
- Actual C# execution in workbench.html is separate from the main-page JavaScript models; no Microsoft DI container package is available in the existing runner.
- Four editable code presets exercise direct construction, manual DI, swapping implementations, and compiler diagnostics.
- Browser runtime integration cannot be validated through connector-only editing; follow up with live browser CI and run checks.
