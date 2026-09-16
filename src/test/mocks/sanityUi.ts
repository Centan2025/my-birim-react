import React from 'react'

const Dummy = ({children}: {children?: React.ReactNode}) =>
  React.createElement('div', null, children)

export const Card = Dummy
export const Box = Dummy
export const Text = Dummy
export const Button = Dummy
export const Flex = Dummy
export const Tooltip = Dummy
export const Spinner = Dummy
export const Stack = Dummy
export const Container = Dummy
export const AvatarCounter = Dummy
export const useToast = () => ({push: () => {}})

export default {
  Card,
  Box,
  Text,
  Button,
  Flex,
  Tooltip,
  Spinner,
  Stack,
  Container,
  AvatarCounter,
  useToast,
}
