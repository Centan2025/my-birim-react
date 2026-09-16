import React from 'react'
const DummyIcon = () => React.createElement('span')
export const SearchIcon = DummyIcon
export const CloseIcon = DummyIcon
export const AddIcon = DummyIcon
export const SyncIcon = DummyIcon
export const DragHandleIcon = DummyIcon
export const ChevronUpIcon = DummyIcon
export const ChevronDownIcon = DummyIcon
export const SortIcon = DummyIcon
export const GenerateIcon = DummyIcon
export default new Proxy({}, {get: () => DummyIcon})
