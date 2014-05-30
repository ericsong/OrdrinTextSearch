Ordrin_TextSearch
=================

Text Search

__GET__ /TextSearch/[rid]/[desc]/[size]

params
======
__rid__ - Restaurant id  
__desc__ - Text description of desired item (ex... "Cucumber Roll", "Stuffed Pizza", "Pepperoni Calzone")  
__size__ - (optional) limits number of responses to this number  

return
======
__group__ - group level item from ordr.in's menu  
__options__ - option level items from ordr.in's menu  
__score__ - Matching score. Sorted by hit score (greater is better) -> miss score (lower is better) -> size score (lower is better)  
__name__ - Text description of the matched item  
__tray__ - Tray string used for ordr.in's order endpoint  
